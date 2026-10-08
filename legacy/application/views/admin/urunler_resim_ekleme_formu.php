<?php
		$this->load->view('admin/header');
		$this->load->view('admin/leftside');
?>

<div class="col-xs-2">
            <h2 align="center" font-weight=" bold">Ürün Resmi Seçiniz</h2><br>
			<div class="col-xs-20">
			<div class="alert alert-info alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <h4><i class="icon fa fa-info"></i> Uyarı!</h4>
                <b>* Maksimum 1024x1024 ve 1024kb olmalıdır.</b>
				</div>
				<?php if($this->session->flashdata('mesaj')){?>
				<div class="callout callout-danger">
				<h4>Yükleme Hatası!</h4>
				<p><?=$this->session->flashdata('mesaj'). print_r($error);?></p>
				
              </div>
			  </div>
				<?php } ?>
			
           <form action="<?=base_url()?>admin/urunler/resim_ekle_kaydet/<?=$id?>" method="post" enctype="multipart/form-data">		   
		  
		   <input type="file" name="resim" required class="form-control" placeholder="ürün resmi seçiniz"/>
		  
	
				<br>
			<input type="submit" value="Yükle"/>
			</form>
     
    
</div>


  <?php
		$this->load->view('admin/footer');
	
?>
