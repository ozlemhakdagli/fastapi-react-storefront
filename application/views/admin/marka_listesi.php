<br>
<br>
        <div class="col-xs-12">
          <div class="box">
            <div class="box-header">
			<?php if($this->session->flashdata('mesaj')){?>
				<div class="callout callout-info">
				<h4>İşlem:</h4>
				<p><?=$this->session->flashdata('mesaj')?></p>
              </div>
			  </div>
				<?php } ?>
              <h2 align="center" font-weight=" bold">Markalar Tablosu</h2><br>
			  <?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div class="alert alert-success alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <i class="icon fa fa-check"></i> <?=$this->session->flashdata('sonuc')?>
                
              </div>
			  <?php } ?>
              
            </div>
            <!-- /.box-header -->
            <div class="box-body table-responsive no-padding">
              <table class="table table-hover" border="1">
			  <thead>
                <tr>
                  <th bgcolor="#99ccff">Sıra No</th>
				  <th bgcolor="#99ccff">Marka Id</th>
                  <th bgcolor="#99ccff">Marka Adı</th>
                  <th bgcolor="#99ccff">keywords</th>
				  <th bgcolor="#99ccff">aciklama</th>
				  <th bgcolor="#99ccff">İşlemler</th>
                </tr>
				</thead>
				<tbody>
                <?php
				$i=0;
				foreach($markalar as $rs)
				{
					
				
                ?>
				
				<tr>
                  <td> <?=++$i?></td>                                  				  
				  <td><?=$rs->Id?></td>
				  <td><?=$rs->adi?></td>
				  <td><?=$rs->keywords?></td>
				  <td><?=$rs->aciklama?></td>
				  <td>
                    <div class="btn-group">
					<a href ="<?=base_url() ?>admin/home/markaedit/<?=$rs->Id ?>"><button type="button" class="btn btn-default"  >Düzenle</button></a>
                   
           
                    <a href ="<?=base_url() ?>admin/home/markadelete/<?=$rs->Id ?>" onclick="return confirm('Silmek istediğinize emin misiniz?')" ><button type="button" class="btn btn-danger">Sil</button></a>
                    </div>
                  </td>
          
				  
				 
				  
                </tr>
				
				
				
				
				
				 <?php
				} 
                ?>
				</tbody>
                
                
              </table>
            </div>
            <!-- /.box-body -->
          </div>
          <!-- /.box -->
        </div>

    </section>
    <!-- /.content -->
  </div>
  <!-- /.content-wrapper -->
  
